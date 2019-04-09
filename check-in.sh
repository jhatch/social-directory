set -e
npm run lint
npm test
rm -rf node_modules
npm i
npm test
sh ./zip.sh
git add .
git commit -m "$1"
git push
