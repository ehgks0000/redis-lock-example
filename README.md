# 구성하기

docker-compose -f ./docker-compose-example.yaml up

redis-cli -c -p 6300
redis-cli -c -h 173.17.0.2 -p 6300

# 설정

셋 중 하나 접속 해서
set a "test"

# 확인해보기

## master
docker exec -it redis-node1 redis-cli -c -h 173.17.0.2 -p 6300
docker exec -it redis-node2 redis-cli -c -h 173.17.0.3 -p 6301
docker exec -it redis-node3 redis-cli -c -h 173.17.0.4 -p 6302

## slave
docker exec -it redis-node4 redis-cli -c -h 173.17.0.5 -p 6303
docker exec -it redis-node5 redis-cli -c -h 173.17.0.6 -p 6304
docker exec -it redis-node6 redis-cli -c -h 173.17.0.7 -p 6305


## Grinder
docker run -d -v ~/ngrinder-controller:/opt/ngrinder-controller --name controller -p 80:80 -p 16001:16001 -p 12000-12009:12000-12009 ngrinder/controller

## agent
docker run -d -v ~/ngrinder-agent:/opt/ngrinder-agent --name agent ngrinder/agent 192.168.0.37:80

### Grinder connect network
docker network connect redis-lock-example_redis_cluster controller
docker network connect redis-lock-example_redis_cluster agent
