export function substituteVariables(templateText: string, variablesJson: string): string {
  try {
    const variableData = JSON.parse(variablesJson);
    let result = templateText;

    Object.entries(variableData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      result = result.replace(regex, stringValue);
    });

    return result;
  } catch {
    return templateText + '\n\n[ERROR: Invalid JSON in variables]';
  }
}


