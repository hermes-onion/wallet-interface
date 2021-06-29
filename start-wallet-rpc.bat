:start
monero-wallet-rpc --daemon-host testnet.community.xmr.to --testnet --trusted-daemon --rpc-bind-port 8885 --rpc-login admin:admin --wallet-dir "%userprofile%\monero" --tx-notify "D:\john\hermes-onion\tx-notify-producer\main.exe %s"

goto start