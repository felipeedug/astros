#include "legacy_calc_api.h"

#include <cmath>
#include <iomanip>
#include <sstream>

#include "CalcMapaCore.h"

namespace astro_legacy {
namespace {

struct Location {
  double latitude;
  double longitude;
  // CalcMapa subtracts dZona; west-of-UTC values are therefore positive here.
  double legacyZone;
};

Location ResolvePlace(const std::string& place) {
  const auto comma = place.find(',');
  std::string city = place.substr(0, comma);
  for (char& character : city) {
    if (character >= 'A' && character <= 'Z') character = static_cast<char>(character - 'A' + 'a');
  }
  if (city == "rio de janeiro") return {-22.9068, -43.1729, 3.0};
  if (city == "brasilia") return {-15.7939, -47.8828, 3.0};
  if (city == "lisboa") return {38.7223, -9.1393, 0.0};
  if (city == "london") return {51.5072, -0.1276, 0.0};
  if (city == "new york") return {40.7128, -74.0060, 5.0};
  return {-23.5505, -46.6333, 3.0};
}

void ParseDate(const std::string& date, int& day, int& month, int& year) {
  char separator1 = '-';
  char separator2 = '-';
  std::istringstream input(date);
  input >> year >> separator1 >> month >> separator2 >> day;
}

double ParseClock(const std::string& time) {
  int hour = 0;
  int minute = 0;
  char separator = ':';
  std::istringstream input(time);
  input >> hour >> separator >> minute;
  return hour + minute / 100.0;
}

int SignAt(double longitude) {
  double normalized = std::fmod(longitude, 360.0);
  if (normalized < 0.0) normalized += 360.0;
  return static_cast<int>(normalized / 30.0);
}

std::string JsonString(const std::string& value) {
  std::string result;
  for (char character : value) {
    if (character == '\\' || character == '"') result += '\\';
    result += character;
  }
  return result;
}

}  // namespace

std::string ComputeNatalChartJson(const std::string& name,
                                  const std::string& date,
                                  const std::string& time,
                                  const std::string& place) {
  int day = 1;
  int month = 1;
  int year = 2000;
  ParseDate(date, day, month, year);
  const Location location = ResolvePlace(place);

  CCalcMapa calculator;
  calculator.CalcularMapa(day, month, year,
                          location.latitude * PI / 180.0,
                          location.longitude * PI / 180.0,
                          ParseClock(time), location.legacyZone, 0.0, nullptr);

  const POSICAO_MAPA& chart = calculator.sChartPos0;
  const double sun = chart.LongitEcliptica[oSun];
  const double moon = chart.LongitEcliptica[oMoo];
  const double ascendant = chart.LongitEcliptica[oAsc];
  const int planetIndexes[] = {oSun, oMoo, oMer, oVen, oMar, oJup, oSat, oUra, oNep, oPlu, oChi, oCer, oVes, oNod, oLil, oFor, oVtx};
  const char* planetNames[] = {"Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron", "Demeter", "Vesta", "Node", "Lilith", "Fortune", "Vertex"};

  std::ostringstream json;
  json << std::fixed << std::setprecision(8);
  json << "{\"chartTitle\":\"Mapa de " << JsonString(name.empty() ? "visitante" : name) << "\",";
  json << "\"centerSign\":\"" << SignAt(sun) << "\",";
  json << "\"centerDegree\":\"" << std::floor(std::fmod(sun + 360.0, 30.0)) << "°\",";
  json << "\"sunLongitude\":" << sun << ",\"moonLongitude\":" << moon << ",\"ascendantLongitude\":" << ascendant << ",";
  json << "\"sunSignIndex\":" << SignAt(sun) << ",\"moonSignIndex\":" << SignAt(moon) << ",\"risingSignIndex\":" << SignAt(ascendant) << ",";
  json << "\"longitudes\":{";
  for (std::size_t index = 0; index < sizeof(planetIndexes) / sizeof(planetIndexes[0]); ++index) {
    if (index != 0) json << ",";
    json << "\"" << planetNames[index] << "\":" << chart.LongitEcliptica[planetIndexes[index]];
  }
  json << "},\"houses\":[";
  for (int house = 1; house <= cSign; ++house) {
    if (house != 1) json << ",";
    json << chart.cusp[house];
  }
  json << "],\"midheaven\":" << chart.LongitEcliptica[oMC] << ",\"status\":\"Calculado pelo nucleo CalcMapa legado.\"}";
  return json.str();
}

}  // namespace astro_legacy