import os
import requests
import zipfile
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset, random_split
from flask import Flask, request, jsonify
from trimesh import load
from transformers import AutoTokenizer, AutoModelForCausalLM

app = Flask(__name__)

# Download and preprocess StructureNet dataset
def download_structurenet_dataset(url, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    dataset_zip = os.path.join(output_dir, "structurenet.zip")
    response = requests.get(url)
    with open(dataset_zip, "wb") as f:
        f.write(response.content)
    with zipfile.ZipFile(dataset_zip, 'r') as zip_ref:
        zip_ref.extractall(output_dir)
    print("Dataset downloaded and extracted.")

def preprocess_obj_to_voxel(obj_path, voxel_resolution=32):
    mesh = load(obj_path)
    voxel_grid = mesh.voxelized(pitch=mesh.scale / voxel_resolution)
    voxel_matrix = voxel_grid.matrix.astype(np.float32)
    return voxel_matrix

# 3D CNN Model
class Building3DCNN(nn.Module):
    def __init__(self):
        super(Building3DCNN, self).__init__()
        self.conv1 = nn.Conv3d(1, 32, kernel_size=3, stride=1, padding=1)
        self.pool = nn.MaxPool3d(2, 2)
        self.conv2 = nn.Conv3d(32, 64, kernel_size=3, stride=1, padding=1)
        self.fc1 = nn.Linear(64 * 4 * 4 * 4, 512)
        self.fc2 = nn.Linear(512, 256)  # Output: 256 features for structure generation

    def forward(self, x):
        x = self.pool(torch.relu(self.conv1(x)))
        x = self.pool(torch.relu(self.conv2(x)))
        x = x.view(-1, 64 * 4 * 4 * 4)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# Structure Generator
class StructureGenerator(nn.Module):
    def __init__(self, input_dim):
        super(StructureGenerator, self).__init__()
        self.fc1 = nn.Linear(input_dim, 512)
        self.fc2 = nn.Linear(512, 1024)
        self.fc3 = nn.Linear(1024, 2048)
        self.fc4 = nn.Linear(2048, 4096)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = torch.relu(self.fc3(x))
        x = torch.sigmoid(self.fc4(x))
        return x

# Global variables
cnn_model = None
generator_model = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
tokenizer = AutoTokenizer.from_pretrained("distilgpt2")
language_model = AutoModelForCausalLM.from_pretrained("distilgpt2")

# Initialize and train the models
def initialize_models():
    global cnn_model, generator_model
    
    # Download and preprocess the dataset
    download_structurenet_dataset("https://github.com/3D-FRONT-FUTURE/3D-FRONT-Dataset/tree/master/3D-FRONT", "./structurenet_data")
    
    data_dir = "./structurenet_data"
    voxel_data = [preprocess_obj_to_voxel(os.path.join(data_dir, file)) for file in os.listdir(data_dir) if file.endswith(".obj")]
    
    # Prepare dataset
    labels = torch.randint(0, 2, (len(voxel_data),))  # Dummy labels, replace with actual labels
    dataset = TensorDataset(torch.tensor(voxel_data).unsqueeze(1), labels)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = random_split(dataset, [train_size, val_size])
    train_loader = DataLoader(train_dataset, batch_size=4, shuffle=True)
    
    # Initialize and train the CNN model
    cnn_model = Building3DCNN().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(cnn_model.parameters(), lr=0.001)
    
    # Train the CNN model
    for epoch in range(10):
        running_loss = 0.0
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = cnn_model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()
        print(f"Epoch {epoch + 1}, Loss: {running_loss/len(train_loader)}")
    
    # Initialize the generator model
    generator_model = StructureGenerator(256 + 768).to(device)  # 256 from CNN, 768 from DistilGPT2
    
    print("Models initialized and trained.")

# Generate 3D structure based on input
def generate_structure(input_text):
    # Process input text with DistilGPT2
    inputs = tokenizer(input_text, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = language_model(**inputs)
        text_features = outputs.last_hidden_state.mean(dim=1)
    
    # Generate random voxel data for demonstration (replace with actual voxel data in production)
    random_voxel = torch.randn(1, 1, 32, 32, 32).to(device)
    
    # Get features from CNN model
    with torch.no_grad():
        cnn_features = cnn_model(random_voxel)
    
    # Combine features
    combined_features = torch.cat((cnn_features, text_features), dim=1)
    
    # Generate structure
    with torch.no_grad():
        generated_structure = generator_model(combined_features)
    
    # Process the generated structure
    structure_array = generated_structure.cpu().numpy().reshape((16, 16, 16))
    
    # Convert to a more usable format
    walls = []
    features = []
    for x in range(16):
        for y in range(16):
            for z in range(16):
                if structure_array[x, y, z] > 0.5:
                    if z == 0:
                        walls.append({"start": [x, y, z], "end": [x+1, y+1, z], "height": 3})
                    elif structure_array[x, y, z] > 0.8:
                        feature_type = "window" if y % 2 == 0 else "door"
                        features.append({"type": feature_type, "position": [x, y, z], "width": 1, "height": 2})

    return {
        "walls": walls,
        "floor": {"width": 16, "length": 16},
        "ceiling": {"width": 16, "length": 16},
        "features": features
    }

@app.route('/generate', methods=['POST'])
def generate_3d_structure():
    data = request.json
    input_text = data.get('input', '')
    
    if not input_text:
        return jsonify({"error": "No input provided"}), 400
    
    structure = generate_structure(input_text)
    return jsonify(structure)

if __name__ == '__main__':
    initialize_models()
    app.run(debug=True)