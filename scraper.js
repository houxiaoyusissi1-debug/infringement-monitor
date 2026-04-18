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

    function cleanReviewCount(s) {
        if (!s) return '0';
        s = s.trim();
        // 提取数字
        var match = s.match(/(\d+)/);
        if (match) return match[1];
        // 处理"万"的情况
        if (s.indexOf('万') !== -1) {
            var n = parseFloat(s);
            if (!isNaN(n)) return (n * 10000).toString();
        }
        return '0';
    }

    // 查找商品链接
    function findProductLinks() {
        // 优先查找直接的商品链接 - 支持多个平台
        var links = document.querySelectorAll(
            'a[href*="//item.taobao.com"], a[href*="//detail.taobao.com"], a[href*="//detail.tmall.com"], ' +
            'a[href*="//mobile.yangkeduo.com"], a[href*="//pinduoduo.com"], ' +
            'a[href*="//item.jd.com"], a[href*="//item.m.jd.com"], ' +
            'a[href*="//detail.1688.com"]'
        );

        // 如果找不到，尝试通过卡片选择器查找
        if (links.length === 0) {
            links = document.querySelectorAll('[class*="Card"], [class*="Item"], [class*="item"], [class*="product"]');
        }

        return links;
    }

    // 判断平台类型
    function getPlatform(href) {
        if (href.indexOf('taobao.com') !== -1) return '淘宝';
        if (href.indexOf('tmall.com') !== -1) return '天猫';
        if (href.indexOf('pinduoduo.com') !== -1 || href.indexOf('yangkeduo.com') !== -1) return '拼多多';
        if (href.indexOf('jd.com') !== -1) return '京东';
        if (href.indexOf('1688.com') !== -1) return '1688';
        return '未知平台';
    }

    // 从卡片中提取商品信息
    function extractProductInfo(link) {
        try {
            var href = link.href || link.getAttribute('href');
            if (!href) return null;

            // 判断平台类型
            var platform = getPlatform(href);

            // 找到包含该链接的卡片
            var card = link.closest('[class*="Card"], [class*="Item"], [class*="item"], [class*="product"]') || link;

            // 提取商品信息 - 使用通用的选择器
            var titleEl = card.querySelector('[class*="title"], [class*="Title"], h3, h2') || link;
            var priceEl = card.querySelector('[class*="price"], [class*="Price"], [class*="money"], [class*="amount"]');
            var salesEl = card.querySelector('[class*="sale"], [class*="deal"], [class*="sold"]');
            var shopEl = card.querySelector('[class*="shop"], [class*="Shop"], [class*="store"], [class*="Store"]');
            var reviewEl = card.querySelector('[class*="review"], [class*="Review"], [class*="comment"], [class*="rate"]');
            var imageEl = card.querySelector('img') || link.querySelector('img');

            var title = (titleEl.textContent || titleEl.getAttribute('title') || '').trim().substring(0, 100);
            var price = priceEl ? cleanPrice(priceEl.textContent) : '';
            var sales = salesEl ? cleanNum(salesEl.textContent) : '0';
            var reviews = reviewEl ? cleanReviewCount(reviewEl.textContent) : '0';
            var shop = shopEl ? shopEl.textContent.trim() : platform + '店铺';
            var image = imageEl ? (imageEl.src || imageEl.getAttribute('data-src')) : '';

            // 处理相对路径图片URL
            if (image && image.indexOf('//') === 0) {
                image = 'https:' + image;
            }

            if (!title || !href) return null;

            return {
                productName: title,
                shopName: shop,
                originalPrice: price,
                salePrice: price,
                sales: sales,
                reviews: reviews,
                link: href,
                image: image,
                platform: platform
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
