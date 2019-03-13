docker network create influxdb
docker run -d -p 8086:8086 --name=influxdb -v influxdb:/var/lib/influxdb --net=influxdb influxdb