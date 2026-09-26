export const cap = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);
export const idPad = (id) => `#${String(id).padStart(3, '0')}`;
export const getArtwork = (pokemon) =>
  pokemon?.sprites?.other?.['official-artwork']?.front_default ||
  pokemon?.sprites?.front_default ||
  '';
export const getTypes = (pokemon) => pokemon?.types?.map((item) => item.type.name) || [];
export const statValue = (pokemon, statName) =>
  pokemon?.stats?.find((item) => item.stat.name === statName)?.base_stat || 0;
export const primaryType = (pokemon) => getTypes(pokemon)[0] || 'normal';
export const totalStats = (pokemon) => pokemon?.stats?.reduce((sum, item) => sum + item.base_stat, 0) || 0;
