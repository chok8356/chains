export default {
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-vue'],
  plugins: ['stylelint-order'],
  rules: {
    'order/properties-alphabetical-order': true,
    'selector-class-pattern': null,
    'selector-id-pattern': null,
  },
}
