# kimradioserver

Server for the kimradio on the RPI3

## Setup your RPI

* sudo apt-get update
* sudo apt-get install npm
* sudo npm install -g bower
* sudo npm install -g n
* sudo n latest
* sudo apt-get install mpg123

## Config the app

### Access point software
* git clone https://github.com/sabhiram/raspberry-wifi-conf.git
* cd raspberry-wifi-conf
* npm install
* now edit config.json and set SSID and PWD to whatever 8-character string you like.
* sudo npm run provision

This will install and configure 
** hostapd ( )
** isc-dhcp-server ( /etc/default/isc-dhcp-server )
** dnsmasq



### Kimradio server
* git clone https://github.com/sponnet/kimradioserver.git
* add '/home/eth/kimradioserver/start.sh &' to /etc/rc.local




