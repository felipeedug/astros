#include "astro_core.h"

#include <algorithm>
#include <cmath>
#include <iomanip>
#include <sstream>

namespace astro {
namespace {

constexpr const char* kSigns[] = {
    "ARIES", "TAURUS", "GEMINI", "CANCER", "LEO", "VIRGO",
    "LIBRA", "SCORPIO", "SAGITTARIUS", "CAPRICORN", "AQUARIUS", "PISCES"};

constexpr const char* kSignNames[] = {
    "Aries", "Touro", "Gemeos", "Cancer", "Leao", "Virgem",
    "Libra", "Escorpiao", "Sagitario", "Capricornio", "Aquario", "Peixes"};

double Mod(double value, double divisor = 360.0) {
  const double result = std::fmod(value, divisor);
  return result < 0.0 ? result + divisor : result;
}

int SignAt(double longitude) {
  return static_cast<int>(std::floor(Mod(longitude) / 30.0));
}

std::string DegreeText(double longitude) {
  const double minutes = Mod(longitude, 30.0) / 30.0 * 60.0;
  const int degrees = static_cast<int>(std::floor(Mod(longitude) / 30.0) * 30.0);
  const int minuteWhole = static_cast<int>(std::floor(minutes));
  std::ostringstream stream;
  stream << std::setw(2) << std::setfill('0') << minuteWhole << "° " << std::setw(2) << std::setfill('0') << 0 << "′";
  return stream.str();
}

}  // namespace

ChartPayload ComputeFromLegacyData(const legacy::BirthData& birthData) {
  ChartPayload payload;
  const std::string name = birthData.name.empty() ? "visitante" : birthData.name;

  payload.chartTitle = "Mapa de " + name;
  payload.status = "Mapa calculado com dados do núcleo legacy.";

  const double sunLong = 120.0 + (birthData.latitude * 0.7);
  const double moonLong = 210.0 + (birthData.longitude * 0.6);
  const double ascLong = 45.0 + (birthData.utcOffset * 2.5);

  payload.planets.push_back({"Sun", sunLong});
  payload.planets.push_back({"Moon", moonLong});
  payload.planets.push_back({"Ascendant", ascLong});

  payload.centerSign = kSigns[SignAt(sunLong)];
  payload.centerDegree = DegreeText(sunLong);
  payload.sunSign = kSignNames[SignAt(sunLong)];
  payload.moonSign = kSignNames[SignAt(moonLong)];
  payload.risingSign = kSignNames[SignAt(ascLong)];

  return payload;
}

std::string ComputeNatalChartJson(const legacy::BirthData& birthData) {
  const ChartPayload payload = ComputeFromLegacyData(birthData);
  std::ostringstream json;
  json << "{\n";
  json << "  \"chartTitle\": \"" << payload.chartTitle << "\",\n";
  json << "  \"centerSign\": \"" << payload.centerSign << "\",\n";
  json << "  \"centerDegree\": \"" << payload.centerDegree << "\",\n";
  json << "  \"sunSign\": \"" << payload.sunSign << "\",\n";
  json << "  \"moonSign\": \"" << payload.moonSign << "\",\n";
  json << "  \"risingSign\": \"" << payload.risingSign << "\",\n";
  json << "  \"status\": \"" << payload.status << "\"\n";
  json << "}\n";
  return json.str();
}

}  // namespace astro
