(async () => {
    define = undefined;
    exports = undefined;
    if (window.module) module.exports = undefined;
    // ↑ required for archivepdf.net

    var script= document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.body.appendChild(script);

    const BASE_ARCHIVE_PDF_URL = "https://www.archivepdf.net"
    if (window.location.origin !== BASE_ARCHIVE_PDF_URL) {
        alert("This bookmarklet is designed to be used with ArchivePdf");
        return;
    };

    const fashionScanRegex = /[a-z0-9-]+-[a-z0-9]+/;
    const scanId = window.location.pathname.replace("/", "")
    if (fashionScanRegex.exec(scanId) == null) {
        alert("No fashion ID could be found, are you in a fashion scan?");
        return;
    };

    if (document.getElementById("wix-warmup-data") == null) {
        alert("Seems like you are still not on fashion scan page")
        return
    }

    const fashionScan = await fetch(window.location.href)
    const htmlPage =  await fashionScan.text()

    const container = document.createElement('div')
    container.innerHTML = htmlPage
    const warmUpDataElement = container.querySelector("[id='wix-warmup-data']")
    const warmUpData = JSON.parse(warmUpDataElement.innerHTML)
    const appsWarmUpData = warmUpData['appsWarmupData']

    let totalItemsCount = null;
    let galleryId = null;
    let baseImages = []
    for (let data of Object.values(appsWarmUpData)) {
        for (const [key, value] of Object.entries(data)) {
            if (key.endsWith("appSettings") && value.hasOwnProperty("galleryId")) {
                galleryId = value["galleryId"]
            }
            if (key.endsWith("galleryData")) {
                for (const item of value["items"]) {
                    baseImages.push(`https://static.wixstatic.com/media/${item["mediaUrl"]}`)
                }
            }
            if (value.hasOwnProperty("totalItemsCount")) {
                totalItemsCount = value["totalItemsCount"]
            }
        }
    }
    if (galleryId == null || totalItemsCount == null) {
        alert("Something very close, but still not what is needed. Navigate to fashion scan")
        return
    }

    async function getChunk(galleryId, offset, limit) {
        try {
            const response = await fetch(`${BASE_ARCHIVE_PDF_URL}/pro-gallery-webapp/v1/galleries/${galleryId}?` + new URLSearchParams({
                offset: offset,
                limit: limit,
                state: "PUBLISHED",
            }))
            if (!response.ok) {
                throw new Error(`Failed to fetch chunk: ${response.statusText}`);
            }

            let responseData = await response.json()

            let items = []
            for (const item of responseData['gallery']['items']) {
                items.push(item["mediaUrl"])
            }
            return items
        } catch (error) {
            console.error("Error fetching image:", error);
            return null;
        }
    }

    async function getImageBytes(imageUrl) {
        try {
            const response = await fetch(imageUrl);

            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return new Uint8Array(arrayBuffer)
        } catch (error) {
            console.error("Error fetching image:", error);
            return null;
        }
    }

    const CHUNK_LIMIT = 200 // max limit
    let tasks = []
    for (let i = 0; i < Math.ceil((totalItemsCount - baseImages.length) / CHUNK_LIMIT); i++) {
        let offset = CHUNK_LIMIT * i + baseImages.length
        tasks.push(getChunk(galleryId, offset, CHUNK_LIMIT))
    }
    let images = (await Promise.all(tasks)).flat(1)
    images = [...baseImages, ...images]

    const downloadConfirm = confirm(`Current scan consist of ${images.length} images. Are you sure you want to download it as .pdf file?`);
    if (!downloadConfirm) {
        return;
    };

    console.log('Starting downloading images...')
    const imageBytePromises = images.map(getImageBytes);
    const imageByteArrays = await Promise.all(imageBytePromises);
    console.log('Finished downloading. Packing images into .pdf file...')

    const height = 1352
    const width = 972
    const doc = new window.jspdf.jsPDF('p', 'mm', [width, height]);
    for (const image of imageByteArrays) {
        doc.addImage(image, 'JPEG', 10, 10, width - 20, height - 20);
        doc.addPage();
    }

    const fileName = `${scanId.replaceAll("-", "_")}.pdf`
    console.log(`Saving file as ${fileName}`)
    doc.setProperties({title: scanId.replaceAll("-", " ")})
    doc.viewerPreferences({'DisplayDocTitle': true});
    doc.save(fileName);
})();