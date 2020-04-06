DEST=""
if [ $1 = "live" ]; then
  DEST="root@kevbot.xyz:/root/sites/the-lounge/"
elif [ $1 = "test" ]; then
  DEST="root@kevbot.xyz:/root/sites/the-lounge-test/"
else
  echo "expected one argument: [live, test]"
  exit 1
fi

echo pushing to $DEST

rsync -v -ah \
    --cvs-exclude --exclude="node_modules" --exclude-from="$(git -C ./ ls-files \
        --exclude-standard -oi --directory >.git/ignores.tmp && \
        echo .git/ignores.tmp)" \
    ./ $DEST
