set -e
./reset.sh
./convert.sh
git add -- src test
git commit -m "x ./commit-convert.sh" --no-verify
