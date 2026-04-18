(function() {
    'use strict';

    // 数据清理函数
    function cleanPrice(s) {
        return s ? s.replace(/[¥¥$\s]/g, '').trim() : '';
    }

    function cleanNum(s) {
        if (!s) return '0';
        var v = s.replace(/\+/g, '');
        var n = parseFloat(v);
        if (s.indexOf('万') !== -1) n = n * 10000;
        return isNaN(n) ? '0' : n.toString();
    }

    // 查找商品链接
    function findProductLinks() {
        // 优先查找直接的商品链接
        var links = document.querySelectorAll('a[href*="//item.taobao.com"], a[href*="//detail.taobao.com"], a[href*="//detail.tmall.com"]');

        // 如果找不到，尝试通过卡片选择器查找
        if (links.length === 0) {
            links = document.querySelectorAll('[class*="Card"], [class*="Item"], [class*="item"]');
        }

        return links;
    }

    // 从卡片中提取商品信息
    function extractProductInfo(link) {
        try {
            var href = link.href || link.getAttribute('href');
            if (!href) return null;

            // 确保是淘宝/天猫链接
            if (href.indexOf('item.taobao') === -1 &&
                href.indexOf('detail.taobao') === -1 &&
                href.indexOf('detail.tmall') === -1) {
                return null;
            }

            // 找到包含该链接的卡片
            var card = link.closest('[class*="Card"], [class*="Item"], [class*="item"]') || link;

            // 提取商品信息
            var titleEl = card.querySelector('[class*="title"], [class*="Title"], h3, h2') || link;
            var priceEl = card.querySelector('[class*="price"], [class*="Price"], [class*="money"]');
            var salesEl = card.querySelector('[class*="sale"], [class*="deal"]');
            var shopEl = card.querySelector('[class*="shop"], [class*="Shop"]');

            var title = (titleEl.textContent || titleEl.getAttribute('title') || '').trim().substring(0, 100);
            var price = priceEl ? cleanPrice(priceEl.textContent) : '';
            var sales = salesEl ? cleanNum(salesEl.textContent) : '0';
            var shop = shopEl ? shopEl.textContent.trim() : '淘宝店铺';

            if (!title || !href) return null;

            return {
                productName: title,
                shopName: shop,
                originalPrice: price,
                salePrice: price,
                sales: sales,
                reviews: '0',
                link: href,
                platform: '淘宝'
            };
        } catch (e) {
            return null;
        }
    }

    // 发送数据回主工具
    function sendData(products) {
        var sent = false;

        // 尝试通过 postMessage 发送
        try {
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage({
                    type: 'infringementData',
                    products: products
                }, '*');
                sent = true;
            }
        } catch (e) {
            console.error('postMessage failed:', e);
        }

        // 备用方案：localStorage
        if (!sent) {
            localStorage.setItem('scrapedData', JSON.stringify(products));
        }

        return sent;
    }

    // 主函数
    function main() {
        var products = [];
        var links = findProductLinks();

        links.forEach(function(link) {
            var product = extractProductInfo(link);
            if (product) {
                products.push(product);
            }
        });

        if (products.length > 0) {
            var sent = sendData(products);
            alert('✅ 抓取成功！共 ' + products.length + ' 个商品' +
                (sent ? '\n\n✅ 数据已自动传回监控工具！' : '\n\n请返回监控工具，点击「导入抓取数据」按钮'));
        } else {
            alert('❌ 未找到商品\n\n请确保：\n1. 在淘宝搜索结果页\n2. 页面已完全加载\n3. 尝试滚动后重试');
        }
    }

    // 执行
    main();
})();
