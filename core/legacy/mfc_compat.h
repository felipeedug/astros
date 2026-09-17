#pragma once

#include <cfloat>
#include "../../migration/legacy_compat.h"

using legacy::BOOL;
using legacy::CString;
using legacy::CStringArray;
using legacy::CFile;
using legacy::UINT;
using legacy::min;
using legacy::max;

#ifndef TRUE
#define TRUE true
#endif
#ifndef FALSE
#define FALSE false
#endif

inline int AfxMessageBox(const char*) { return 0; }

#define TRY try
#define CATCH(type, variable) catch (...) 
#define END_CATCH
#define _T(value) value
#define CONST const
