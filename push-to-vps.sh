rsync -v -ah --delete \
    --cvs-exclude --exclude-from="$(git -C ./ ls-files \
        --exclude-standard -oi --directory >.git/ignores.tmp && \
        echo .git/ignores.tmp)" \
    ./ root@kevbot.xyz:/root/sites/the-lounge/ 