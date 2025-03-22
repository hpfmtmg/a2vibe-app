#!/bin/bash

# Build the application
npm run build

# Create deployment directory
mkdir -p deploy

# Copy necessary files
cp -r .next deploy/
cp -r public deploy/
cp -r node_modules deploy/
cp package.json deploy/
cp package-lock.json deploy/
cp .env deploy/
cp .htaccess deploy/
cp next.config.mjs deploy/

# Create a start script
echo "#!/bin/bash
cd \$(dirname \$0)
npm install
npm run start" > deploy/start.sh

chmod +x deploy/start.sh

# Create a zip file
zip -r deploy.zip deploy/

echo "Deployment package created as deploy.zip" 