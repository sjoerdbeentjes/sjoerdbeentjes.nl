import fs from 'node:fs/promises';
import { load } from 'cheerio';

const dataDir = 'src/data';

const fetchHtml = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching HTML from ${url}:`, error);
    throw error;
  }
};

const handleImage = async (imgUrl: string) => {
  try {
    const imageName = imgUrl.split('/').pop()?.split('?')[0] || '';
    const originalImageUrl = imgUrl.replace('resize:fill:224:224/', '');

    const response = await fetch(originalImageUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();

    const imagesDir = 'src/data/images';
    await fs.mkdir(imagesDir, { recursive: true });

    const imagePath = `${imagesDir}/${imageName}`;
    await fs.writeFile(imagePath, Buffer.from(imageBuffer));

    return imageName;
  } catch (error) {
    console.error(`Error handling image ${imgUrl}:`, error);
    throw error;
  }
};

const scrapeArticles = async () => {
  try {
    const url = 'https://medium.com/@sjoerd3000';
    const html = await fetchHtml(url);
    const $ = load(html);
    const articleElements = $('article')

    const articles = await Promise.all(articleElements.map(async (_, element) => {
      const title = $(element).find('h2').text();
      const excerpt = $($(element).find('p').get(1)).text();
      const path = $(element).find('a').attr('href');
      const articleUrl = `https://medium.com${path?.split('?')[0]}`;
      const imgUrl = $(element).find('img').attr('src');
  
      if (imgUrl) {
        const imageName = await handleImage(imgUrl);
  
        return {
          url: articleUrl,
          title,
          excerpt,
          imageName,
        };
      } else {
        return {
          url: articleUrl,
          title,
          excerpt,
        };
      }
    }));

    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(`${dataDir}/articles.json`, JSON.stringify(articles, null, 2));
  } catch (error) {
    console.error('Error scraping articles:', error);
  }
};

scrapeArticles().then(() => console.log('Scraping completed.'));
