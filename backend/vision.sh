#!/bin/bash

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# Change directory to the parent of the script directory
cd "$(dirname "$SCRIPT_DIR")"
echo "Running vision.sh from $(pwd)"

# Get all image files from the 'images' directory
image_files=(images/*)
total_images=${#image_files[@]}

# Check if there are any image files
if [ $total_images -eq 0 ]; then
    echo "No image files found in the 'images' directory."
    exit 1
fi

# Process images in batches of 10
batch_size=20
for ((i=0; i<total_images; i+=batch_size)); do
    # Get the next batch of images (up to 10)
    batch_end=$((i + batch_size))
    if [ $batch_end -gt $total_images ]; then
        batch_end=$total_images
    fi

    echo "Processing batch $((i/batch_size + 1))..."

    # Run vision.py with the current batch of images
    echo "$SCRIPT_DIR/vision.py" "${image_files[@]:i:batch_size}"
    /mnt/c/Users/adibv/anaconda3/envs/light/python.exe "backend/vision.py" "${image_files[@]:i:batch_size}"

    echo "Batch $((i/batch_size + 1)) completed."
    echo
done

echo "All batches processed."
