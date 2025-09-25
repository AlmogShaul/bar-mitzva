# Use a lightweight web server
FROM nginx:alpine

# Copy build files to the Nginx HTML directory
COPY build/ /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
