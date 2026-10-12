FROM node:24-alpine

# RUN apk add --no-cache --update imagemagick \
#     curl\
#     ffmpeg\
#     ca-certificates \
#     openssl \
#     lame-libs \
#     libogg \
#     libvpx \
#     libvorbis \
#     libtheora \
#     opus \
#     rtmpdump \
#     x264-libs \
#     x265-libs \
#     libass \
#     libwebp \
#     libwebpmux \
#     libwebpdemux \
#     freetype \
#     libxcb \
#     xcb-util \
#     xcb-util-image \
#     xcb-util-keysyms \
#     xcb-util-renderutil \
#     xcb-util-wm \
#     bash \
#     netcat-openbsd \
#     inetutils-telnet \
#    	postgresql-client \
#     imagemagick-heic \
#     imagemagick-jp2 \
#     imagemagick-jpeg \
#     imagemagick-jxl \
#     imagemagick-libs \
#     imagemagick-openexr \
#     imagemagick-pango \
#     imagemagick-pdf \
#     imagemagick-svg \
#     imagemagick-tiff \
#     imagemagick-webp \
#     typst

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# two-step copying, so we get better caching
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install

# Copying source files
COPY . /app/

# Building app
#RUN npm run build
EXPOSE 3000

# Running the app
#ENTRYPOINT ["sh", "docker_entrypoint.sh"]
