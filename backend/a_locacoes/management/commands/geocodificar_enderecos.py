import json
import time
import urllib.parse
import urllib.request
from django.core.management.base import BaseCommand
from a_locacoes.models import Endereco


class Command(BaseCommand):
    help = "Geocodifica endereços salvos no banco que não possuem latitude e longitude."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Força a atualização de todos os endereços, mesmo os que já possuem coordenadas.",
        )
        parser.add_argument(
            "--id",
            type=int,
            help="Geocodifica apenas o endereço com o ID especificado.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Executa a busca sem salvar as coordenadas no banco de dados.",
        )

    def geocode_query(self, query: str):
        """Consulta o Nominatim (OpenStreetMap) com uma string de endereço."""
        clean_query = query.strip()
        if not clean_query:
            return None

        url = f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(clean_query)}&countrycodes=br&limit=1"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "GerenciamentoLocacao/1.0 (gerenciamento-locacao@local.app)",
                "Accept-Language": "pt-BR,pt;q=0.9",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    if data and len(data) > 0:
                        return {
                            "lat": float(data[0]["lat"]),
                            "lon": float(data[0]["lon"]),
                            "display_name": data[0].get("display_name", ""),
                        }
        except Exception as e:
            self.stderr.write(f"Erro na requisição ({clean_query}): {e}")

        return None

    def find_coordinates(self, endereco: Endereco):
        """Tenta geocodificar o endereço usando várias tentativas (do mais específico ao mais genérico)."""
        rua = (endereco.rua or "").strip()
        numero = (endereco.numero or "").strip()
        bairro = (endereco.bairro or "").strip()
        cidade = (endereco.cidade or "").strip()
        estado = (endereco.estado or "PR").strip()

        if not cidade:
            return None, "Endereço sem cidade"

        # Lista de tentativas por ordem de precisão
        tentativas = []

        # 1. Rua + Número + Bairro + Cidade + Estado
        if rua and numero and numero not in ["0", "S/N", "sn", "s/n"]:
            partes = [f"{rua}, {numero}"]
            if bairro:
                partes.append(bairro)
            partes.extend([cidade, estado, "Brasil"])
            tentativas.append(("Número exato", ", ".join(partes)))

        # 2. Rua + Bairro + Cidade + Estado
        if rua:
            partes = [rua]
            if bairro:
                partes.append(bairro)
            partes.extend([cidade, estado, "Brasil"])
            tentativas.append(("Rua/Logradouro", ", ".join(partes)))

        # 3. Bairro + Cidade + Estado
        if bairro:
            tentativas.append(("Bairro", f"{bairro}, {cidade}, {estado}, Brasil"))

        # 4. Cidade + Estado
        tentativas.append(("Cidade", f"{cidade}, {estado}, Brasil"))

        for label, query in tentativas:
            time.sleep(1.0)  # Respeita o limite de taxa do OpenStreetMap (1 req/seg)
            result = self.geocode_query(query)
            if result:
                return result, label

        return None, "Não encontrado"

    def handle(self, *args, **options):
        force = options.get("force", False)
        endereco_id = options.get("id")
        dry_run = options.get("dry_run", False)

        qs = Endereco.objects.all()

        if endereco_id:
            qs = qs.filter(id=endereco_id)
        elif not force:
            qs = qs.filter(latitude__isnull=True) | qs.filter(longitude__isnull=True)

        enderecos = list(qs.order_by("id"))
        total = len(enderecos)

        if total == 0:
            self.stdout.write(
                self.style.SUCCESS("Nenhum endereço pendente de coordenadas encontrado!")
            )
            return

        self.stdout.write(
            self.style.NOTICE(
                f"Iniciando geocodificação de {total} endereço(s)..."
                + (" (DRY RUN - Sem salvar)" if dry_run else "")
            )
        )

        sucessos = 0
        falhas = 0

        for idx, end in enumerate(enderecos, start=1):
            desc = f"ID {end.id}: {end.rua or 'Sem rua'}, {end.numero or 'S/N'} - {end.bairro or ''} ({end.cidade}/{end.estado})"
            self.stdout.write(f"[{idx}/{total}] Processando {desc}...")

            coords, metodo = self.find_coordinates(end)

            if coords:
                lat = coords["lat"]
                lon = coords["lon"]
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  -> Coordenadas encontradas ({metodo}): {lat:.6f}, {lon:.6f}"
                    )
                )

                if not dry_run:
                    end.latitude = lat
                    end.longitude = lon
                    end.save(update_fields=["latitude", "longitude"])

                sucessos += 1
            else:
                self.stdout.write(
                    self.style.WARNING(f"  -> Falha ao localizar endereço ({metodo}).")
                )
                falhas += 1

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Concluído! Sucessos: {sucessos} | Falhas: {falhas} | Total: {total}"
            )
        )
