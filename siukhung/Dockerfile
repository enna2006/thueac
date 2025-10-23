# Bước 1: Chọn một máy chủ web siêu nhẹ
FROM nginx:alpine

# Bước 2: Xóa các file web mặc định của nginx
RUN rm -rf /usr/share/nginx/html/*

# Bước 3: Chép TẤT CẢ code của bạn (từ thư mục SIUKHUNG) 
# vào thư mục web của máy chủ
COPY . /usr/share/nginx/html

# Bước 4: (Tùy chọn) Báo cho Docker biết container sẽ chạy ở cổng 80
EXPOSE 80