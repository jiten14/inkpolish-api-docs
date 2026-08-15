(function () {
    var content = document.querySelector('.page-main');
    var tocList = document.getElementById('page-toc-list');
    var toc = document.getElementById('page-toc');

    if (!content || !tocList || !toc) { return; }

    var headings = content.querySelectorAll('h2, h3');

    // No sidebar shown at all on a page with nothing to link to -
    // rather than an empty, pointless box next to the content.
    if (headings.length === 0) { return; }

    headings.forEach(function (heading) {
        // kramdown (Jekyll's markdown processor) auto-generates an id
        // for every heading already - nothing extra needed for these
        // links to actually work as real in-page anchors.
        if (!heading.id) { return; }

        var link = document.createElement('a');
        link.href = '#' + heading.id;
        link.textContent = heading.textContent;

        if (heading.tagName === 'H3') {
            link.className = 'toc-h3';
        }

        var item = document.createElement('li');
        item.appendChild(link);
        tocList.appendChild(item);
    });

    toc.classList.add('has-items');
})();