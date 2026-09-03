/**
 * Utilitários de geolocalização, CEP e rotas de GPS
 */

export interface ViaCepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Busca dados de endereço através do CEP brasileiro (ViaCEP)
 */
export async function fetchAddressByCep(cep: string): Promise<ViaCepResult | null> {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!response.ok) return null;
    const data: ViaCepResult = await response.json();
    if (data.erro) return null;
    return data;
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return null;
  }
}

/**
 * Geocodifica uma string de endereço em latitude e longitude (Nominatim OpenStreetMap)
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  if (!query || query.trim().length < 3) return null;

  try {
    const encoded = encodeURIComponent(query.trim());
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=br&limit=1`,
      {
        headers: {
          "Accept-Language": "pt-BR",
        },
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
    return null;
  } catch (error) {
    console.error("Erro na geocodificação:", error);
    return null;
  }
}

/**
 * Geocodifica endereço completo tentando primeiro com número exato e depois por rua/cidade se necessário
 */
export async function geocodeFullAddress(endereco?: {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
} | null): Promise<GeocodeResult | null> {
  if (!endereco) return null;
  const { rua, numero, bairro, cidade, estado } = endereco;
  if (!rua || !cidade) return null;

  // Tentativa 1: Endereço completo com número
  if (numero) {
    const queryComNumero = [
      `${rua}, ${numero}`,
      bairro,
      cidade,
      estado || "PR",
      "Brasil",
    ]
      .filter(Boolean)
      .join(", ");

    const result1 = await geocodeAddress(queryComNumero);
    if (result1) return result1;
  }

  // Tentativa 2: Rua + Cidade + Estado
  const queryRuaCidade = [rua, bairro, cidade, estado || "PR", "Brasil"]
    .filter(Boolean)
    .join(", ");

  const result2 = await geocodeAddress(queryRuaCidade);
  if (result2) return result2;

  // Tentativa 3: Rua + Cidade
  return await geocodeAddress(`${rua}, ${cidade}, Brasil`);
}

/**
 * Geocodificação reversa: Coordenadas -> Endereço
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ rua?: string; bairro?: string; cidade?: string; estado?: string; cep?: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "pt-BR",
        },
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      return {
        rua: addr.road || addr.pedestrian || addr.street || "",
        bairro: addr.suburb || addr.neighbourhood || addr.city_district || "",
        cidade: addr.city || addr.town || addr.municipality || addr.village || "",
        estado: addr.state_code || addr.state || "PR",
        cep: addr.postcode ? addr.postcode.replace(/\D/g, "") : "",
      };
    }
    return null;
  } catch (error) {
    console.error("Erro na geocodificação reversa:", error);
    return null;
  }
}

/**
 * Gera URL de navegação/rota para o Google Maps
 */
export function getGoogleMapsUrl(
  lat?: number | string | null,
  lng?: number | string | null,
  addressText?: string
): string {
  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (addressText) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressText)}`;
  }
  return "https://maps.google.com";
}

/**
 * Gera URL de navegação para o Waze
 */
export function getWazeUrl(
  lat?: number | string | null,
  lng?: number | string | null,
  addressText?: string
): string {
  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }
  if (addressText) {
    return `https://waze.com/ul?q=${encodeURIComponent(addressText)}&navigate=yes`;
  }
  return "https://waze.com";
}

/**
 * Gera URL de navegação para o Apple Maps
 */
export function getAppleMapsUrl(
  lat?: number | string | null,
  lng?: number | string | null,
  addressText?: string
): string {
  if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
    return `https://maps.apple.com/?daddr=${lat},${lng}`;
  }
  if (addressText) {
    return `https://maps.apple.com/?daddr=${encodeURIComponent(addressText)}`;
  }
  return "https://maps.apple.com";
}

/**
 * Formata endereço completo em string única
 */
export function formatFullAddress(endereco?: {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
} | null): string {
  if (!endereco) return "";
  const parts: string[] = [];
  if (endereco.rua) {
    parts.push(endereco.numero ? `${endereco.rua}, ${endereco.numero}` : endereco.rua);
  }
  if (endereco.bairro) parts.push(endereco.bairro);
  if (endereco.cidade) {
    parts.push(endereco.estado ? `${endereco.cidade} - ${endereco.estado}` : endereco.cidade);
  }
  if (endereco.cep) parts.push(`CEP: ${endereco.cep}`);
  return parts.join(", ");
}
