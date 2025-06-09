FROM apify/actor-node-puppeteer-chrome

COPY . ./

RUN npm install --omit=dev --no-optional

CMD xvfb-run -a -s "-ac -screen 0 1920x1080x24+32 -nolisten tcp" npm start --silent
