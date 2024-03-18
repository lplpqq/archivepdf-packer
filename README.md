# archivepdf packer
<div style="text-align:center">

**Browser bookmarklet that allows to download a fashion scan from archivepdf.net as a single .pdf file**
</div>


## Setup

### Minifying code

Install the uglifyjs module to minify code from index.js

```bash
$ npm install uglify-js
```

Minify code and save it in index.min.js file

```bash
$ uglifyjs index.js -o index.min.js; echo -e "javascript:$(cat index.min.js)" > index.min.js
```

Open the index.min.js file and copy content of it


### Google Chrome

- Navigate to `chrome://bookmarks/`
- Right-click on page and select `Add new bookmark`
- Create bookmarklet name (make it intuitive)
- For bookmarklet URL, put the minified code which you have obtained from previous step

## Usage

- Navigate to any fashion scan on `https://archivepdf.net/`
- Click on the bookmarklet on the top of your page
- Approve downloading .pdf file of the current fashion scan
- Give bookmarklet some time to process all images
- Voilà! The .pdf file should have gone to your downloads. Enjoy!
