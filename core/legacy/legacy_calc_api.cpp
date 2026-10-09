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
  // Legacy CalcMapa uses positive degrees for west longitudes.
  double legacyZone;
};

Location ResolvePlace(const std::string& place) {
  const auto comma = place.find(',');
  std::string city = place.substr(0, comma);
  for (char& character : city) {
    if (character >= 'A' && character <= 'Z') character = static_cast<char>(character - 'A' + 'a');
  }
  if (city == "rio de janeiro") return {-22.9068, 43.1729, -3.0};
  if (city == "brasilia") return {-15.7939, 47.8828, -3.0};
  if (city == "lisboa") return {38.7223, 9.1393, 0.0};
  if (city == "london") return {51.5072, 0.1276, 0.0};
  if (city == "new york") return {40.7128, 74.0060, -5.0};
  return {-23.5505, 46.6333, -3.0};
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
                                  const std::string& place,
                                  bool daylightSaving,
                                  double latitude,
                                  double longitude,
                                  double utcOffset) {
  int day = 1;
  int month = 1;
  int year = 2000;
  std::istringstream dateInput(date);
  char dateSeparator1 = '-';
  char dateSeparator2 = '-';
  dateInput >> year >> dateSeparator1 >> month >> dateSeparator2 >> day;
  Location location = ResolvePlace(place);
  if (std::isfinite(latitude) && std::isfinite(longitude) && std::isfinite(utcOffset)) {
    location.latitude = latitude;
    location.longitude = -longitude;
    location.legacyZone = utcOffset;
  }
  if (daylightSaving) {
    location.legacyZone += 1.0;
  }

  CCalcMapa calculator;
  calculator.CalcularMapa(day, month, year,
                          location.latitude * PI / 180.0,
                          location.longitude * PI / 180.0,
                          ParseClock(time), location.legacyZone, 0.0, nullptr);

  const POSICAO_MAPA& chart = calculator.sChartPos0;
  const POSICAO_MAPA* angleChart = &chart;
  const double sun = chart.LongitEcliptica[oSun];
  const double moon = chart.LongitEcliptica[oMoo];
  const double ascendant = angleChart->LongitEcliptica[oAsc];
  const int planetIndexes[] = {oSun, oMoo, oMer, oVen, oMar, oJup, oSat, oUra, oNep, oPlu, oAsc, oMC, oNod, oCau, oFor, oEP, oVtx, oLil, oPri, oChi, oCer, oCer + 1, oCer + 2, oVes};
  const char* planetNames[] = {"Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Ascendant", "Midheaven", "NorthNode", "SouthNode", "Fortune", "EastPoint", "Vertex", "Lilith", "Priapo", "Chiron", "Demeter", "Pallas", "Juno", "Vesta"};

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
    json << angleChart->cusp[house];
  }
  json << "],\"midheaven\":" << angleChart->LongitEcliptica[oMC] << ",\"status\":\"Calculado pelo nucleo CalcMapa legado.\"}";
  return json.str();
}

namespace {

// Conversao data/hora local <-> dia juliano (calendario gregoriano).
double DateToJd(int day, int month, int year, double hour) {
  int adjustedYear = year;
  int adjustedMonth = month;
  if (adjustedMonth <= 2) {
    adjustedYear -= 1;
    adjustedMonth += 12;
  }
  const int a = adjustedYear / 100;
  const int b = 2 - a + a / 4;
  return std::floor(365.25 * (adjustedYear + 4716)) + std::floor(30.6001 * (adjustedMonth + 1)) +
         day + b - 1524.5 + hour / 24.0;
}

void JdToDate(double jd, int& day, int& month, int& year, double& hour) {
  jd += 0.5;
  const double whole = std::floor(jd);
  const double fraction = jd - whole;
  double a = whole;
  if (whole >= 2299161.0) {
    const double alpha = std::floor((whole - 1867216.25) / 36524.25);
    a = whole + 1.0 + alpha - std::floor(alpha / 4.0);
  }
  const double b = a + 1524.0;
  const double c = std::floor((b - 122.1) / 365.25);
  const double d = std::floor(365.25 * c);
  const double e = std::floor((b - d) / 30.6001);
  day = static_cast<int>(b - d - std::floor(30.6001 * e));
  month = static_cast<int>(e < 14 ? e - 1 : e - 13);
  year = static_cast<int>(month > 2 ? c - 4716 : c - 4715);
  hour = fraction * 24.0;
}

int DaysInMonth(int year, int month) {
  static const int days[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
  if (month == 2 && (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0))) return 29;
  return days[month - 1];
}

// O nucleo usa formato Hms para a hora (10.05 = 10h05) e zona decimal legada.
double HmsFromDecimalHour(double hour) {
  const int wholeHour = static_cast<int>(hour);
  const int minute = static_cast<int>(std::floor((hour - wholeHour) * 60.0 + 0.5));
  return wholeHour + minute / 100.0;
}

double MoonLongitudeAt(double jd, double utcOffset, CCalcMapa& calculator) {
  int day, month, year;
  double hour;
  JdToDate(jd, day, month, year, hour);
  calculator.CalcularMapa(day, month, year, 0.0, 0.0, HmsFromDecimalHour(hour), utcOffset, 0.0, nullptr);
  return calculator.sChartPos0.LongitEcliptica[oMoo];
}

// Instante em que a Lua atinge a longitude alvo, por bissecao no tempo.
double FindMoonIngress(double jdStart, double targetLongitude, double utcOffset, CCalcMapa& calculator) {
  double low = jdStart;
  double high = jdStart + 3.0;
  for (int iteration = 0; iteration < 48; ++iteration) {
    const double middle = (low + high) / 2.0;
    if (MoonLongitudeAt(middle, utcOffset, calculator) < targetLongitude) low = middle;
    else high = middle;
  }
  return (low + high) / 2.0;
}

// Margem de 1 minuto de arco do Astrovida original para aspecto exato.
bool HasExactMoonAspect(CCalcMapa& calculator) {
  const double moon = calculator.sChartPos0.LongitEcliptica[oMoo];
  static const double margins[] = {0.0, 60.0, 90.0, 120.0, 180.0};
  for (int planet = oSun; planet < oChi; ++planet) {
    if (planet == oMoo) continue;
    double difference = std::fabs(moon - calculator.sChartPos0.LongitEcliptica[planet]);
    if (difference > 180.0) difference = 360.0 - difference;
    for (double margin : margins) {
      if (std::fabs(difference - margin) <= 0.0083333) return true;
    }
  }
  return false;
}

// Retrocede do ingresso ate o ultimo aspecto exato da Lua, como o original (passos de 1 minuto).
double FindVoidMoonStart(double ingressJd, double utcOffset, CCalcMapa& calculator) {
  const double minuteStep = 1.0 / 1440.0;
  double jd = ingressJd - minuteStep;
  const double limit = ingressJd - 3.0;
  int day, month, year;
  double hour;
  while (jd > limit) {
    JdToDate(jd, day, month, year, hour);
    calculator.CalcularMapa(day, month, year, 0.0, 0.0, HmsFromDecimalHour(hour), utcOffset, 0.0, nullptr);
    if (HasExactMoonAspect(calculator)) return jd;
    jd -= minuteStep;
  }
  return limit;
}

}  // namespace

std::string ComputeEphemerisMonthJson(int year, int month, double utcOffset, double hour) {
  const int planetIndexes[] = {oSun, oMoo, oMer, oVen, oMar, oJup, oSat, oUra, oNep, oPlu};
  const char* planetNames[] = {"Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"};
  const int totalDays = DaysInMonth(year, month);

  CCalcMapa calculator;
  std::ostringstream json;
  json << std::fixed << std::setprecision(6);
  json << "{\"year\":" << year << ",\"month\":" << month << ",\"utcOffset\":" << utcOffset << ",\"hour\":" << hour << ",\"days\":[";
  for (int day = 1; day <= totalDays; ++day) {
    if (day != 1) json << ",";
    calculator.CalcularMapa(day, month, year, 0.0, 0.0, HmsFromDecimalHour(hour), utcOffset, 0.0, nullptr);
    json << "{\"day\":" << day << ",\"planets\":[";
    for (std::size_t index = 0; index < sizeof(planetIndexes) / sizeof(planetIndexes[0]); ++index) {
      if (index != 0) json << ",";
      const double longitude = calculator.sChartPos0.LongitEcliptica[planetIndexes[index]];
      const int signIndex = SignAt(longitude);
      const double withinSign = std::fmod(longitude + 360.0, 360.0) - signIndex * 30.0;
      const int degree = static_cast<int>(withinSign);
      const int minute = static_cast<int>((withinSign - degree) * 60.0 + 0.5);
      json << "{\"name\":\"" << planetNames[index] << "\",\"longitude\":" << longitude
           << ",\"signIndex\":" << signIndex << ",\"degree\":" << degree << ",\"minute\":" << minute
           << ",\"retrograde\":" << (calculator.sChartPos0.Velocidade[planetIndexes[index]] < 0.0 ? "true" : "false") << "}";
    }
    json << "]}";
  }
  json << "]}";
  return json.str();
}

std::string ComputeVoidMoonJson(int year, int month, double utcOffset) {
  CCalcMapa calculator;
  std::ostringstream json;
  json << std::fixed << std::setprecision(8);
  json << "{\"year\":" << year << ",\"month\":" << month << ",\"utcOffset\":" << utcOffset << ",\"periods\":[";

  double cursor = DateToJd(1, month, year, 0.0);
  const double end = DateToJd(DaysInMonth(year, month), month, year, 24.0);
  bool first = true;
  while (cursor < end) {
    const double moonLongitude = MoonLongitudeAt(cursor, utcOffset, calculator);
    const double targetLongitude = (std::floor(moonLongitude / 30.0) + 1.0) * 30.0;
    const double ingressJd = FindMoonIngress(cursor, targetLongitude, utcOffset, calculator);
    if (ingressJd > end) break;
    const double voidStartJd = FindVoidMoonStart(ingressJd, utcOffset, calculator);
    const int signIndex = static_cast<int>(targetLongitude / 30.0) % 12;
    if (!first) json << ",";
    first = false;
    json << "{\"startJd\":" << voidStartJd << ",\"endJd\":" << ingressJd << ",\"signIndex\":" << signIndex << "}";
    cursor = ingressJd + 1.0;
  }
  json << "]}";
  return json.str();
}

}  // namespace astro_legacy