<template>
    <div v-if="type === 'reva'">
        <RevaLogin-component/>
    </div>
    <div v-else-if="type === 'okta'">
        <OktaLoginComponent/>
    </div>
</template>

<script>
import {OktaLoginComponent} from '../../../plugins/okta';

export default {
    components: {OktaLoginComponent},
    data() {
        return {}
    },
    computed: {
        type: function () {
            return this.$store.state.configuration.services.type;
        }
    }
}
</script>

<style scoped>

</style>
