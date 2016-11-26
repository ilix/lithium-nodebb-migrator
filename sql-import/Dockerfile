FROM debian

RUN apt-get update
RUN apt-get -y install mysql-client

ADD ./data /data
ADD ./import.sh /import.sh

CMD /bin/bash /import.sh
