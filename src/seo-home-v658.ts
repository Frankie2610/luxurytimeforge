export interface HomeSeoFaqItem {
  question: string;
  answer: string;
  link: string;
  linkLabel: string;
}

export const HOME_SEO_FAQS: HomeSeoFaqItem[] = [
  {
    question: 'Đồng hồ tại Luxury TimeForge có chính hãng không?',
    answer: 'Luxury TimeForge cam kết sản phẩm chính hãng, thông tin nguồn hàng và chính sách được trình bày minh bạch để khách dễ kiểm tra trước khi mua.',
    link: '/pages/about',
    linkLabel: 'Về Luxury TimeForge',
  },
  {
    question: 'Thời hạn bảo hành đồng hồ là bao lâu?',
    answer: 'Versace và Ferragamo được hỗ trợ tối đa 4 năm, gồm 2 năm bảo hành toàn cầu và 2 năm hỗ trợ tại Việt Nam. Các thương hiệu còn lại áp dụng 2 năm tại Việt Nam hoặc theo bảo hành quốc tế đi kèm sản phẩm.',
    link: '/pages/warranty',
    linkLabel: 'Xem chính sách bảo hành',
  },
  {
    question: 'Luxury TimeForge có giao hàng toàn quốc không?',
    answer: 'Có. TimeForge hỗ trợ giao hàng toàn quốc; đơn hàng thường được giao trong 1–4 ngày làm việc sau khi xác nhận, tùy khu vực và tình trạng sản phẩm.',
    link: '/pages/shipping',
    linkLabel: 'Xem chính sách giao hàng',
  },
  {
    question: 'Tôi có thể đổi trả đồng hồ như thế nào?',
    answer: 'Yêu cầu đổi trả được xem xét theo tình trạng sản phẩm, thời điểm tiếp nhận và điều kiện đã công bố. Khách nên liên hệ sớm và giữ nguyên hộp, phụ kiện, tem cùng chứng từ đi kèm.',
    link: '/pages/returns',
    linkLabel: 'Xem chính sách đổi trả',
  },
];
