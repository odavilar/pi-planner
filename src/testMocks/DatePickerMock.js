const React = require('react');

function DatePicker(props) {
  const { value = '', onChange } = props;
  return React.createElement('input', {
    'data-testid': 'mock-date-picker',
    value,
    onChange: (e) => onChange && onChange(e.target.value),
  });
}

module.exports = { DatePicker };
