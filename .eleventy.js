// importações para os vários plugins do Eleventy (navegação e imagem)
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const { DateTime } = require('luxon');
const Image = require('@11ty/eleventy-img');
const path = require('path');

// permite o uso de {% image... %} para criar imagens responsivas e otimizadas
// ALTERE AS QUERIES DE MÍDIA E LARGURAS PADRÃO
async function imageShortcode(src, alt, className, loading, sizes = '(max-width: 600px) 400px, 850px') {
  // se não passar um alt? ignore. passar uma string vazia é ok
  if (alt === undefined) {
    throw new Error(`Faltando \`alt\` na imagem responsiva de: ${src}`);
  }

  // cria os metadados para uma imagem otimizada
  let metadata = await Image(`${src}`, {
    widths: [200, 400, 850, 1920, 2500],
    formats: ['webp', 'jpeg'],
    urlPath: '/images/',
    outputDir: './public/images',
    filenameFormat: function (id, src, width, format, options) {
      const extension = path.extname(src);
      const name = path.basename(src, extension);
      return `${name}-${width}w.${format}`;
    },
  });

  // obtém a menor e a maior imagem para os atributos picture/image
  let lowsrc = metadata.jpeg[0];
  let highsrc = metadata.jpeg[metadata.jpeg.length - 1];

  // quando {% image ... %} é usado, isso é o que será retornado
  return `<picture class="${className}">
    ${Object.values(metadata)
      .map((imageFormat) => {
        return `  <source type="${imageFormat[0].sourceType}" srcset="${imageFormat
          .map((entry) => entry.srcset)
          .join(', ')}" sizes="${sizes}">`;
      })
      .join('\n')}
      <img
        src="${lowsrc.url}"
        width="${highsrc.width}"
        height="${highsrc.height}"
        alt="${alt}"
        loading="${loading}"
        decoding="async">
    </picture>`;
}

module.exports = function (eleventyConfig) {
  // adiciona o plugin de navegação para navegações fáceis
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // permite que arquivos CSS, assets, robots.txt e arquivos de configuração do CMS sejam copiados para /public
  eleventyConfig.addPassthroughCopy('./src/css/**/*.css');
  eleventyConfig.addPassthroughCopy('./src/assets');
  eleventyConfig.addPassthroughCopy('./src/admin');
  eleventyConfig.addPassthroughCopy('./src/_redirects');
  eleventyConfig.addPassthroughCopy({ './src/robots.txt': '/robots.txt' });

  // abre ao rodar o npm start e observa alterações nos arquivos CSS - não aciona a reconstrução do 11ty
  eleventyConfig.setBrowserSyncConfig({
    open: true,
    files: './public/css/**/*.css',
  });

  // permite o uso do shortcode {% image %} para imagens otimizadas (em webp se possível)
  eleventyConfig.addNunjucksAsyncShortcode('image', imageShortcode);

  // normalmente, o 11ty renderiza as datas nos posts do blog no formato completo de JSDate (Fri Dec 02 18:00:00 GMT-0600). Isso é feio
  // esse filtro permite que as datas sejam convertidas para um formato normal e localizado. veja a documentação para aprender mais (https://moment.github.io/luxon/api-docs/index.html#datetime)
  eleventyConfig.addFilter('postDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      layouts: "_layouts",
      output: 'public',
    },
    // permite que arquivos .html contenham a linguagem de template Nunjucks
    htmlTemplateEngine: 'njk',
  };
};
