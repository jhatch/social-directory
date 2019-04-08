set -e
rm -rf node_modules
npm i
npm run lint
npm test
sh ./zip.sh
git add .
git commit -m "$1"
git push
