const axios = require('axios');

let config = {
  method: 'get',
  maxBodyLength: Infinity,
  url: 'https://www.stxavierspatna.in/menu/photogallery/default.aspx',
  headers: { 
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7', 
    'accept-language': 'en-US,en;q=0.9', 
    'cache-control': 'max-age=0', 
    'dnt': '1', 
    'priority': 'u=0, i', 
    'referer': 'https://www.google.com/', 
    'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"', 
    'sec-ch-ua-mobile': '?1', 
    'sec-ch-ua-platform': '"Android"', 
    'sec-fetch-dest': 'document', 
    'sec-fetch-mode': 'navigate', 
    'sec-fetch-site': 'cross-site', 
    'sec-fetch-user': '?1', 
    'upgrade-insecure-requests': '1', 
    'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36', 
    'Cookie': 'ASP.NET_SessionId=c1e352rhd10w3azxyscsnhcd; Visitor=UserVisitor'
  }
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
