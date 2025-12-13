#!/usr/bin/env python3
"""
Update RoboFlow Basketball Form Classifier with Enhanced Categories

This script updates the Basketball-Form-Quality-Classifier project in RoboFlow
with 18 comprehensive categories covering all aspects of shooting form.

Requirements:
- roboflow Python SDK
- Valid API keys for the project
"""

import os
import json
import sys
from typing import Dict, List
from roboflow import Roboflow

# API Keys
PRIVATE_API_KEY = os.getenv("ROBOFLOW_API_KEY", "rDWynPrytSysASUlyGvK")
PUBLISHABLE_API_KEY = os.getenv("ROBOFLOW_PUBLISHABLE_KEY", "rf_qisv7ZQd27SzKITWRc2blZZo5F83")

# Project configuration
WORKSPACE_ID = "tbf-inc"
PROJECT_ID = "basketball-form-quality-classifier"


def load_classifier_config(config_path: str = "roboflow_classifier_config.json") -> Dict:
    """Load the enhanced classifier configuration from JSON file"""
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        print(f"✅ Loaded configuration with {len(config['categories'])} categories")
        return config
    except FileNotFoundError:
        print(f"❌ Configuration file not found: {config_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in configuration file: {e}")
        sys.exit(1)


def update_project_description(rf: Roboflow, config: Dict) -> bool:
    """Update the project description and metadata"""
    try:
        workspace = rf.workspace(WORKSPACE_ID)
        project = workspace.project(PROJECT_ID)
        
        # Note: RoboFlow API has limited support for programmatic project updates
        # Most configuration must be done through the web interface
        
        print(f"\n📋 Project Information:")
        print(f"   Name: {config['project_name']}")
        print(f"   Description: {config['project_description'][:100]}...")
        print(f"   Version: {config['version']}")
        print(f"   Categories: {len(config['categories'])}")
        
        print("\n⚠️  Note: Project description and category configuration must be updated")
        print("   through the RoboFlow web interface at:")
        print(f"   https://app.roboflow.com/{WORKSPACE_ID}/{PROJECT_ID}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error accessing project: {e}")
        return False


def generate_annotation_template(config: Dict, output_path: str = "annotation_template.json") -> None:
    """Generate a template file for annotators showing all categories and labels"""
    
    template = {
        "project": config["project_name"],
        "version": config["version"],
        "annotation_instructions": config["annotation_guidelines"],
        "categories": []
    }
    
    for category in config["categories"]:
        cat_info = {
            "category_name": category["display_name"],
            "category_id": category["name"],
            "description": category["description"],
            "labels": [
                {
                    "label_name": label["display"],
                    "label_id": label["name"],
                    "description": label["description"],
                    "biomechanical_range": label.get("biomechanical_range", "N/A"),
                    "severity": label.get("severity", "neutral")
                }
                for label in category["labels"]
            ]
        }
        template["categories"].append(cat_info)
    
    with open(output_path, 'w') as f:
        json.dump(template, f, indent=2)
    
    print(f"✅ Generated annotation template: {output_path}")


def print_category_summary(config: Dict) -> None:
    """Print a summary of all categories and their labels"""
    
    print("\n" + "=" * 80)
    print("ENHANCED BASKETBALL FORM CLASSIFIER - CATEGORY SUMMARY")
    print("=" * 80)
    
    for i, category in enumerate(config["categories"], 1):
        print(f"\n{i}. {category['display_name']} ({category['name']})")
        print(f"   Description: {category['description']}")
        print(f"   Labels ({len(category['labels'])}):")
        
        for j, label in enumerate(category["labels"], 1):
            severity_emoji = {
                "excellent": "🟢",
                "good": "🔵",
                "moderate": "🟡",
                "needs_improvement": "🟠",
                "poor": "🔴",
                "critical": "⚫",
                "neutral": "⚪"
            }.get(label.get("severity", "neutral"), "⚪")
            
            print(f"      {severity_emoji} {j}. {label['display']}")
            print(f"         Range: {label.get('biomechanical_range', 'N/A')}")
    
    print("\n" + "=" * 80)
    print(f"Total Categories: {len(config['categories'])}")
    total_labels = sum(len(cat['labels']) for cat in config['categories'])
    print(f"Total Labels: {total_labels}")
    print("=" * 80)


def generate_roboflow_setup_instructions(config: Dict) -> str:
    """Generate step-by-step instructions for setting up the classifier in RoboFlow"""
    
    instructions = f"""
# RoboFlow Basketball Form Classifier Setup Instructions

## Project Configuration

**Workspace:** {WORKSPACE_ID}
**Project ID:** {PROJECT_ID}
**Project Type:** Multi-Label Classification
**Version:** {config['version']}

## Step 1: Access the Project

1. Go to: https://app.roboflow.com/{WORKSPACE_ID}/{PROJECT_ID}
2. Log in with your RoboFlow account
3. Navigate to "Settings" → "Project Settings"

## Step 2: Update Project Description

Update the project description to:

```
{config['project_description']}
```

## Step 3: Configure Categories (Classes)

This classifier uses {len(config['categories'])} comprehensive categories for multi-label classification.

**IMPORTANT:** In RoboFlow multi-label classification, each "class" is actually a label.
You'll need to create labels using this naming convention: `category_name__label_name`

### All Categories and Labels:

"""
    
    # Add all categories and labels
    for category in config['categories']:
        instructions += f"\n### {category['display_name']}\n"
        instructions += f"{category['description']}\n\n"
        
        for label in category['labels']:
            roboflow_label = f"{category['name']}__{label['name']}"
            instructions += f"- `{roboflow_label}`\n"
            instructions += f"  - Display: {label['display']}\n"
            instructions += f"  - Description: {label['description']}\n"
            instructions += f"  - Range: {label.get('biomechanical_range', 'N/A')}\n"
            instructions += f"  - Severity: {label.get('severity', 'neutral')}\n\n"
    
    instructions += f"""

## Step 4: Configure Model Settings

1. Navigate to "Generate" → "Training Settings"
2. Set the following parameters:
   - **Preprocessing:**
     - Auto-Orient: {config['api_configuration']['auto_orient']}
     - Auto Contrast: {config['api_configuration']['preprocessing']['auto_contrast']}
     - Grayscale: {config['api_configuration']['preprocessing']['grayscale']}
   
   - **Inference Settings:**
     - Min Confidence: {config['api_configuration']['min_confidence']}
     - Max Predictions per Category: {config['api_configuration']['max_predictions_per_category']}

## Step 5: Label Format Convention

When annotating images, use labels in this format:
`{config['categories'][0]['name']}__{config['categories'][0]['labels'][0]['name']}`

Example labels:
- `shooting_hand_mechanics__optimal_wrist_snap`
- `elbow_alignment__perfect_inline`
- `follow_through__full_gooseneck_hold`
- `shooting_phase__release_point`

## Step 6: Upload Training Data

1. Prepare images showing various shooting forms
2. For each image, add multiple labels (multi-label classification)
3. Ensure good coverage of all categories and labels
4. Aim for:
   - Minimum 50 images per label
   - Balanced distribution across severity levels
   - Diverse shooter body types and shot types

## Step 7: Train the Model

1. Once you have sufficient labeled data, click "Train"
2. Select "Multi-Label Classification" model type
3. Use the default training settings or customize as needed
4. Wait for training to complete (typically 20-40 minutes)

## Step 8: Test and Deploy

1. Test the model with new images
2. Review predictions for accuracy
3. Deploy the model to your preferred environment
4. Use the API keys to integrate with your application

## API Integration

Use the following API keys for integration:

- **Private API Key:** {PRIVATE_API_KEY[:20]}...
- **Publishable API Key:** {PUBLISHABLE_API_KEY[:20]}...

## Python Integration Example

```python
from roboflow import Roboflow

rf = Roboflow(api_key="{PRIVATE_API_KEY}")
project = rf.workspace("{WORKSPACE_ID}").project("{PROJECT_ID}")
model = project.version(1).model

# Predict on an image
result = model.predict("basketball_shot.jpg")
predictions = result.json()

# Parse multi-label results
for prediction in predictions.get("predicted_classes", []):
    category, label = prediction.split("__")
    print(f"{{category}}: {{label}}")
```

## Annotation Guidelines

See `ANNOTATION_GUIDE.md` for detailed annotation instructions including:
- Image quality requirements
- How to assess each category
- Examples and edge cases
- Quality control checklist

## Support

For questions or issues:
1. Check RoboFlow documentation: https://docs.roboflow.com
2. Review the annotation guide and category documentation
3. Contact the project maintainer

---

Generated by: update_roboflow_classifier.py
Configuration: roboflow_classifier_config.json
"""
    
    return instructions


def main():
    """Main execution function"""
    
    print("=" * 80)
    print("ROBOFLOW BASKETBALL FORM CLASSIFIER UPDATER")
    print("=" * 80)
    
    # Load configuration
    config_path = os.path.join(os.path.dirname(__file__), "roboflow_classifier_config.json")
    config = load_classifier_config(config_path)
    
    # Print category summary
    print_category_summary(config)
    
    # Initialize RoboFlow
    print("\n\n🔑 Initializing RoboFlow connection...")
    try:
        rf = Roboflow(api_key=PRIVATE_API_KEY)
        print("✅ Connected to RoboFlow")
    except Exception as e:
        print(f"❌ Failed to connect to RoboFlow: {e}")
        sys.exit(1)
    
    # Update project information
    print("\n\n📝 Updating project configuration...")
    success = update_project_description(rf, config)
    
    # Generate annotation template
    print("\n\n📄 Generating annotation template...")
    template_path = os.path.join(os.path.dirname(__file__), "annotation_template.json")
    generate_annotation_template(config, template_path)
    
    # Generate setup instructions
    print("\n\n📋 Generating setup instructions...")
    instructions = generate_roboflow_setup_instructions(config)
    instructions_path = os.path.join(os.path.dirname(__file__), "ROBOFLOW_SETUP_INSTRUCTIONS.md")
    with open(instructions_path, 'w') as f:
        f.write(instructions)
    print(f"✅ Generated setup instructions: {instructions_path}")
    
    # Summary
    print("\n\n" + "=" * 80)
    print("SETUP COMPLETE")
    print("=" * 80)
    print("\n✅ Generated Files:")
    print(f"   1. {template_path}")
    print(f"   2. {instructions_path}")
    
    print("\n📋 Next Steps:")
    print("   1. Review the setup instructions document")
    print("   2. Follow the step-by-step guide to configure RoboFlow")
    print("   3. Upload and label training data")
    print("   4. Train the enhanced classifier model")
    print("   5. Test and deploy")
    
    print("\n⚠️  Important Notes:")
    print("   - RoboFlow requires manual configuration through web interface")
    print("   - Label naming convention: category__label (double underscore)")
    print("   - Minimum 50 images per label recommended")
    print("   - Multi-label classification allows multiple predictions per image")
    
    print("\n" + "=" * 80)
    

if __name__ == "__main__":
    main()
