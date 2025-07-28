FROM nginx:alpine

# Copy all admin portal files to nginx web root
COPY . /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]