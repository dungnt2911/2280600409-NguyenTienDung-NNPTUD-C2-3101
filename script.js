const API_URL = 'https://api.escuelajs.co/api/v1/products';

// Biến lưu tất cả sản phẩm
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortOrder = { title: null, price: null }; // null, 'asc', 'desc'

// Hàm getAll - Lấy tất cả sản phẩm từ API
async function getAll() {
    try {
        const response = await fetch(API_URL);
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        return [];
    }
}

// Hàm làm sạch URL ảnh (API có thể trả về URL bị bọc thêm ký tự thừa)
function cleanImageUrl(url) {
    if (!url) return '';
    let cleaned = url;

    // Nếu URL bắt đầu bằng [ thì có thể là JSON string
    if (cleaned.startsWith('[')) {
        try {
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0) {
                cleaned = parsed[0];
            }
        } catch (e) {
            // Nếu không parse được, xóa ký tự thừa
            cleaned = cleaned.replace(/[\[\]"']/g, '');
        }
    }

    // Xóa dấu ngoặc và dấu nháy thừa còn lại
    cleaned = cleaned.replace(/^[\[\]"']+|[\[\]"']+$/g, '');

    console.log('Original URL:', url, '-> Cleaned URL:', cleaned);
    return cleaned.trim();
}

// Hàm hiển thị sản phẩm lên bảng
function displayProducts(products) {
    const tbody = document.getElementById('productBody');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        // Lấy ảnh đầu tiên từ mảng images và làm sạch URL
        const rawUrl = product.images && product.images.length > 0 ? product.images[0] : '';
        const imageUrl = cleanImageUrl(rawUrl);
        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${imageUrl}" alt="${product.title}" onerror="this.onerror=null; this.style.display='none';"></td>
            <td>${product.title}</td>
            <td>$${product.price}</td>
            <td class="description-cell"><span class="description-text">${product.description}</span></td>
            <td>${product.category.name}</td>
        `;
        tbody.appendChild(row);
    });
}

// Hàm tìm kiếm theo title
function searchProducts(keyword) {
    filteredProducts = allProducts.filter(product =>
        product.title.toLowerCase().includes(keyword.toLowerCase())
    );
    currentPage = 1;
    renderPage();
}

// Hàm hiển thị trang hiện tại
function renderPage() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = filteredProducts.slice(start, end);

    displayProducts(pageProducts);
    updatePageInfo(totalPages);
}

// Cập nhật thông tin trang
function updatePageInfo(totalPages) {
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    pageInfo.textContent = `Trang ${currentPage} / ${totalPages || 1}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// Hàm sắp xếp sản phẩm
function sortProducts(field) {
    // Chuyển đổi trạng thái: null -> asc -> desc -> null
    if (sortOrder[field] === null) {
        sortOrder[field] = 'asc';
    } else if (sortOrder[field] === 'asc') {
        sortOrder[field] = 'desc';
    } else {
        sortOrder[field] = null;
    }

    // Reset trạng thái cột khác
    if (field === 'title') sortOrder.price = null;
    if (field === 'price') sortOrder.title = null;

    // Sắp xếp filteredProducts
    if (sortOrder[field] === null) {
        // Reset về thứ tự ban đầu
        const keyword = document.getElementById('searchInput').value;
        filteredProducts = allProducts.filter(product =>
            product.title.toLowerCase().includes(keyword.toLowerCase())
        );
    } else {
        filteredProducts.sort((a, b) => {
            let valA, valB;
            if (field === 'title') {
                valA = a.title.toLowerCase();
                valB = b.title.toLowerCase();
            } else {
                valA = a.price;
                valB = b.price;
            }

            if (valA < valB) return sortOrder[field] === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder[field] === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Cập nhật icon nút
    updateSortButtons();
    currentPage = 1;
    renderPage();
}

// Cập nhật icon nút sắp xếp
function updateSortButtons() {
    const sortTitleBtn = document.getElementById('sortTitle');
    const sortPriceBtn = document.getElementById('sortPrice');

    sortTitleBtn.textContent = sortOrder.title === 'asc' ? '↑' : sortOrder.title === 'desc' ? '↓' : '⇅';
    sortPriceBtn.textContent = sortOrder.price === 'asc' ? '↑' : sortOrder.price === 'desc' ? '↓' : '⇅';
}

// Khởi chạy khi trang load
document.addEventListener('DOMContentLoaded', async () => {
    const loading = document.getElementById('loading');
    const searchInput = document.getElementById('searchInput');
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const sortTitleBtn = document.getElementById('sortTitle');
    const sortPriceBtn = document.getElementById('sortPrice');

    // Lấy dữ liệu và lưu vào biến toàn cục
    allProducts = await getAll();
    filteredProducts = allProducts;

    loading.style.display = 'none';
    renderPage();

    // Sự kiện tìm kiếm khi người dùng nhập
    searchInput.addEventListener('input', (e) => {
        searchProducts(e.target.value);
    });

    // Sự kiện thay đổi số items mỗi trang
    itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderPage();
    });

    // Sự kiện nút Trước
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage();
        }
    });

    // Sự kiện nút Sau
    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderPage();
        }
    });

    // Sự kiện nút sắp xếp theo Tiêu đề
    sortTitleBtn.addEventListener('click', () => {
        sortProducts('title');
    });

    // Sự kiện nút sắp xếp theo Giá
    sortPriceBtn.addEventListener('click', () => {
        sortProducts('price');
    });
});