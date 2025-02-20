import torch
import torch.nn as nn
import torch.nn.functional as F

class SEBlock(nn.Module):
    """Squeeze-and-Excitation Block with improved reduction ratio"""
    def __init__(self, in_channels, reduction=8):  # Stronger reduction
        super(SEBlock, self).__init__()
        self.global_avg_pool = nn.AdaptiveAvgPool2d(1)
        self.fc1 = nn.Linear(in_channels, in_channels // reduction)
        self.fc2 = nn.Linear(in_channels // reduction, in_channels)
        
    def forward(self, x):
        batch, channels, _, _ = x.shape
        out = self.global_avg_pool(x).view(batch, channels)
        out = F.relu(self.fc1(out))
        out = torch.sigmoid(self.fc2(out)).view(batch, channels, 1, 1)
        return x * out

class ResidualSEBlock(nn.Module):
    """Squeeze-and-Excitation Block with Residual Connection"""
    def __init__(self, in_channels, reduction=8):
        super(ResidualSEBlock, self).__init__()
        self.se = SEBlock(in_channels, reduction)
        self.bn = nn.BatchNorm2d(in_channels)
        
    def forward(self, x):
        residual = x
        out = self.se(x)
        out = self.bn(out)
        out += residual  # True residual connection
        return F.relu(out)

class ImprovedInceptionBlock(nn.Module):
    def __init__(self, in_channels, out_channels):
        super(ImprovedInceptionBlock, self).__init__()
        branch_channels = out_channels // 4
        
        # 1x1 Conv (Pointwise)
        self.conv1x1 = nn.Conv2d(in_channels, branch_channels, kernel_size=1)
        self.bn1x1 = nn.BatchNorm2d(branch_channels)
        
        # 3x3 Conv with bottleneck
        reduced_channels = in_channels // 2
        self.conv3x3 = nn.Sequential(
            nn.Conv2d(in_channels, reduced_channels, kernel_size=1),  # Bottleneck
            nn.BatchNorm2d(reduced_channels),
            nn.ReLU(inplace=True),
            # Fixed depthwise separable convolution - each channel operates on itself
            nn.Conv2d(reduced_channels, reduced_channels, kernel_size=3, padding=1, groups=reduced_channels),
            nn.Conv2d(reduced_channels, branch_channels, kernel_size=1),  # Pointwise to change channels
            nn.BatchNorm2d(branch_channels)
        )
        
        # 5x5 Conv with bottleneck
        self.conv5x5 = nn.Sequential(
            nn.Conv2d(in_channels, reduced_channels, kernel_size=1),  # Bottleneck
            nn.BatchNorm2d(reduced_channels),
            nn.ReLU(inplace=True),
            # Fixed depthwise separable convolution
            nn.Conv2d(reduced_channels, reduced_channels, kernel_size=5, padding=2, groups=reduced_channels),
            nn.Conv2d(reduced_channels, branch_channels, kernel_size=1),  # Pointwise
            nn.BatchNorm2d(branch_channels)
        )
        
        # Spatial Pyramid Pooling branch
        self.pool_proj = nn.Sequential(
            nn.MaxPool2d(kernel_size=3, stride=1, padding=1),
            nn.Conv2d(in_channels, branch_channels, kernel_size=1),
            nn.BatchNorm2d(branch_channels)
        )
        
        # Residual Squeeze-and-Excitation for Feature Enhancement
        self.res_se = ResidualSEBlock(out_channels)
        
    def forward(self, x):
        x1 = F.relu(self.bn1x1(self.conv1x1(x)))
        x2 = F.relu(self.conv3x3(x))
        x3 = F.relu(self.conv5x5(x))
        x4 = F.relu(self.pool_proj(x))
        
        # Concatenate along channel dimension
        out = torch.cat([x1, x2, x3, x4], dim=1)
        out = self.res_se(out)  # Apply Residual SE
        return out

class DeepCNN(nn.Module):
    def __init__(self, input_channels=1, num_classes=7):
        super(DeepCNN, self).__init__()
        
        # Initial Conv Layers
        self.stem = nn.Sequential(
            nn.Conv2d(input_channels, 32, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True)
        )
        
        # First block
        self.block1 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        
        # Inception Blocks with proper residual connections
        self.inception1 = ImprovedInceptionBlock(128, 192)
        self.inception2 = ImprovedInceptionBlock(192, 256)
        
        # Transition layer with gradual reduction
        self.transition = nn.Sequential(
            nn.Conv2d(256, 256, kernel_size=1),  # 1x1 to reduce channels
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        
        # Deep feature extraction
        self.features = nn.Sequential(
            nn.Conv2d(256, 384, kernel_size=3, padding=1),
            nn.BatchNorm2d(384),
            nn.ReLU(inplace=True),
            ResidualSEBlock(384),
            nn.Conv2d(384, 512, kernel_size=3, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True),
            ResidualSEBlock(512),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        
        # Global pooling to handle variable input sizes
        self.global_pool = nn.AdaptiveAvgPool2d(1)
        
        # Classifier with dropout
        self.classifier = nn.Sequential(
            nn.Linear(512, 1024),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(1024, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )
        
    def forward(self, x):
        # Stem and initial blocks
        x = self.stem(x)
        x = self.block1(x)
        
        # Inception blocks
        x = self.inception1(x)
        x = self.inception2(x)
        
        # Transition and deep feature extraction
        x = self.transition(x)
        x = self.features(x)
        
        # Global pooling (handles variable input size)
        x = self.global_pool(x)
        x = torch.flatten(x, 1)
        
        # Classification
        x = self.classifier(x)
        
        return x

# Example usage

