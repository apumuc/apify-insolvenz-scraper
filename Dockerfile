FROM apify/actor-node-puppeteer-chrome:20

COPY . ./

RUN npm install --quiet --only=prod --no-optional && (npm list || true)
