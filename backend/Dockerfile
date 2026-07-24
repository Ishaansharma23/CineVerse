# -      rw-      r--     r--  @    24
# Directory 

# Owner ki acess

# Group ki acess

# Others ki access 

# R-> 4 
# W-> 2
# X ->. 1  === 700 

# x= as a script chala payers ( run kr payers script ko)

# @-> meta data 

# 24->(Ye number of hard links hai.)
#  Is directory ke andar kitni subdirectories (folders) hain.




# pehle base img
FROM node:22-alpine

# directory jisme hogi files hmari 
WORKDIR /app

# package.json aur package-lock.json container me copy ho chuke hain.
# Ab npm install container ke andar chalega aur sari dependencies install karega.
#
# Agar package.json change nahi hua hoga to Docker is layer ko cache se use karega
# aur npm install dobara nahi chalega.
#
# Agar package.json ya package-lock.json change hua hoga
# to cache invalidate ho jayegi aur npm install fir se execute hoga.
# COPY ./package.json ./package.json
# COPY ./package-lock.json ./package-lock.json

COPY package*.json ./

# install dependencies 
RUN npm install

# Copy the remaining project files
COPY . .

# container ke andar port 5000 pe open rhega 
EXPOSE 5000

#start command app ko krne ki 
CMD ["npm" , "start"]


