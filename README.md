## Hyperledger Fabric Samples
## Prereqs

Clone git repo
then
```bash
cd HyperLedger_research/scripts
chmod u+x prereqs-ubuntu.sh
cd ..   
./scripts/prereqs-ubuntu.sh
```

## Golang installation

```bash
cd ..
wget https://dl.google.com/go/go1.12.14.linux-amd64.tar.gz
tar -xzvf go1.12.14.linux-amd64.tar.gz
mv go/ /usr/local
```
Open bashrc

```bash
nano ~/.bashrc
```

Add this command

```bash
export GOPATH=/usr/local/go
export PATH=$PATH:$GOPATH/bin
```

```bash
source ~/.bashrc
```

## Download Binaries and Docker Images

The [`scripts/bootstrap.sh`]
script will preload all of the requisite docker
images for Hyperledger Fabric and tag them with the 'latest' tag. Optionally,
specify a version for fabric, fabric-ca and thirdparty images. Default versions
are 1.4.1, 1.4.1 and 0.4.15 respectively.

```bash
chmod u+x bootstrap.sh
./scripts/bootstrap.sh
```

## Change Fabric Samples

Remove the fabcar folder and then past oru custom fabcar. Do same with chaincode folder.

```bash
cd

cd /home/username/fabric/fabric-samples

rm -R fabcar

cd chaincode

rm -R fabcar
```
Move our custom cc and server app.

```bash
cd ..
cd /home/username/fabric/chaincode
mv fabcar /home/username/fabric/fabric-samples/chaincode
```

```bash
cd ..
cd /home/username/fabric/
mv fabcar /home/username/fabric/fabric-samples/
```

## Start Fabric Network


```bash
cd /fabric-samples/fabcar/
node enrollAdmin.js
node registerUser.js
```

```bash
chmod u+x startFabric.sh
./startFabric.sh node
```
