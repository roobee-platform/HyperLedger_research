[//]: # (SPDX-License-Identifier: CC-BY-4.0)

## Hyperledger Fabric Samples
## Prereqs

```bash
./scripts/prereqs-ubuntu.sh
```

## Golang installation

```bash
wget https://dl.google.com/go/go1.11.2.linux-amd64.tar.gz
tar -xzvf go1.11.2.linux-amd64.tar.gz
mv go/ /usr/local
```

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

```bash
sudo apt-get install curl
```

## Download Binaries and Docker Images

The [`scripts/bootstrap.sh`]
script will preload all of the requisite docker
images for Hyperledger Fabric and tag them with the 'latest' tag. Optionally,
specify a version for fabric, fabric-ca and thirdparty images. Default versions
are 1.4.1, 1.4.1 and 0.4.15 respectively.

```bash
./scripts/bootstrap.sh
```
## Change Fabric Samples

Remove the fabcar folder and then past oru custom fabcar. Do this with chaincode folder.

