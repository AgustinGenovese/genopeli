export function getStreamingUrl(providerId: number | undefined, titulo: string, tipo: 'movie' | 'tv'): string {
  const query = encodeURIComponent(titulo);
  
  switch (providerId) {
    case 8:
      return `https://www.netflix.com/search?q=${query}`;
    case 337:
      return `https://www.disneyplus.com/search?q=${query}`;
    case 384:
      return `https://www.max.com/search?q=${query}`;
    case 119:
      return `https://www.primevideo.com/s?k=${query}`;
    case 531:
      return `https://www.paramountplus.com/search/?searchTerm=${query}`;
    case 2:
      return `https://play.google.com/store/search?q=${query}&c=movies`;
    case 3:
      return `https://play.google.com/store/search?q=${query}&c=movies`;
    case 35:
      return `https://www.rovio.com/search?q=${query}`;
    case 387:
      return `https://www.emboraplace.com/search?q=${query}`;
    case 386:
      return `https://www.pclar.com/search?q=${query}`;
    case 505:
      return `https://www.peacocktv.com/search?q=${query}`;
    case 9:
      return `https://www.apple.com/apple-tv-plus/search/?q=${query}`;
    case 10:
      return `https://tv.apple.com/search?term=${query}`;
    case 550:
      return `https://www.pluto.tv/search?q=${query}`;
    case 11:
      return `https://www.criterionchannel.com/search?q=${query}`;
    case 613:
      return `https://www.mubimovies.com/search?q=${query}`;
    default:
      return `https://www.google.com/search?q=${query}+${tipo === 'movie' ? 'pelicula' : 'serie'}+streaming`;
  }
}
