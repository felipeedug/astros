#pragma once

#include <array>
#include <algorithm>
#include <cstdarg>
#include <cstdio>
#include <cstdint>
#include <cstring>
#include <fstream>
#include <string>
#include <vector>

namespace legacy {

using std::string;
using BOOL = bool;
using UINT = unsigned int;

class CString {
public:
  CString() = default;
  CString(const char* text) : value_(text ? text : "") {}
  CString(const std::string& text) : value_(text) {}

  const char* GetString() const { return value_.c_str(); }
  const char* GetBuffer(int = 0) const { return value_.c_str(); }
  operator const char*() const { return value_.c_str(); }
  std::string ToStdString() const { return value_; }
  size_t GetLength() const { return value_.size(); }
  bool IsEmpty() const { return value_.empty(); }

  CString& operator=(const char* text) {
    value_ = text ? text : "";
    return *this;
  }

  CString& operator+=(const char* text) {
    if (text) value_ += text;
    return *this;
  }

  CString& operator+=(const CString& text) {
    value_ += text.value_;
    return *this;
  }

  template<typename... Args>
  void Format(const char* format, Args... args) {
    const int size = std::snprintf(nullptr, 0, format, args...);
    if (size <= 0) {
      value_.clear();
      return;
    }
    value_.resize(static_cast<std::size_t>(size), '\0');
    std::snprintf(value_.data(), static_cast<std::size_t>(size) + 1, format, args...);
  }

  void Format(const char* format, const CString& argument) {
    const int size = std::snprintf(nullptr, 0, format, argument.GetString());
    if (size <= 0) {
      value_.clear();
      return;
    }
    value_.resize(static_cast<std::size_t>(size), '\0');
    std::snprintf(value_.data(), static_cast<std::size_t>(size) + 1, format, argument.GetString());
  }

  friend bool operator==(const CString& lhs, const char* rhs) {
    return lhs.value_ == (rhs ? rhs : "");
  }

  friend bool operator!=(const CString& lhs, const char* rhs) {
    return !(lhs == rhs);
  }

  friend CString operator+(const char* lhs, const CString& rhs) {
    return CString(std::string(lhs ? lhs : "") + rhs.value_);
  }

  friend CString operator+(const CString& lhs, const char* rhs) {
    return CString(lhs.value_ + (rhs ? rhs : ""));
  }

  friend CString operator+(const CString& lhs, const CString& rhs) {
    return CString(lhs.value_ + rhs.value_);
  }

private:
  std::string value_;
};

class CFile {
public:
  enum OpenMode { modeRead };
  enum SeekPosition { begin };

  CFile() = default;
  ~CFile() { Close(); }

  bool Open(const std::string& path, OpenMode = modeRead) {
    Close();
    stream_.open(path, std::ios::in | std::ios::binary);
    if (!stream_.is_open()) {
      stream_.open("data/ephemerides/" + path, std::ios::in | std::ios::binary);
    }
    return stream_.is_open();
  }

  UINT Read(void* buffer, std::size_t size) {
    if (!stream_.is_open() || !buffer) return 0;
    stream_.read(static_cast<char*>(buffer), static_cast<std::streamsize>(size));
    return static_cast<UINT>(stream_.gcount());
  }

  long Seek(long offset, SeekPosition = begin) {
    if (!stream_.is_open()) return -1;
    stream_.clear();
    stream_.seekg(offset, std::ios::beg);
    return stream_ ? static_cast<long>(stream_.tellg()) : -1;
  }

  void Close() {
    if (stream_.is_open()) stream_.close();
  }

private:
  std::ifstream stream_;
};

template<typename T>
class CArray {
public:
  void Add(const T& value) { values_.push_back(value); }
  void RemoveAll() { values_.clear(); }
  int GetSize() const { return static_cast<int>(values_.size()); }
  T& GetAt(int index) { return values_.at(static_cast<std::size_t>(index)); }
  const T& GetAt(int index) const { return values_.at(static_cast<std::size_t>(index)); }

private:
  std::vector<T> values_;
};

using CStringArray = CArray<CString>;

inline int AfxMessageBox(const CString&) { return 0; }

template<typename T>
constexpr const T& min(const T& lhs, const T& rhs) { return std::min(lhs, rhs); }

template<typename T>
constexpr const T& max(const T& lhs, const T& rhs) { return std::max(lhs, rhs); }

struct BirthData {
  std::string name;
  std::string date;
  std::string time;
  std::string place;
  double latitude = 0.0;
  double longitude = 0.0;
  int utcOffset = 0;
};

struct NatalChart {
  std::string chartTitle;
  std::string signSun;
  std::string signMoon;
  std::string signAscendant;
  std::string centerSign;
  std::string degreeText;
  std::string status;
  double sunLong = 0.0;
  double moonLong = 0.0;
  double ascLong = 0.0;
};

}  // namespace legacy
