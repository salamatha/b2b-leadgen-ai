
# Example Dockerfile for Playwright worker (needs Playwright dependencies)
FROM mcr.microsoft.com/playwright:v1.35.0-focal

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY . .
CMD ["node", "dist/worker.js"]
