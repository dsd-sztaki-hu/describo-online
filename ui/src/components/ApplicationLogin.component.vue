<template>
    <div></div>
</template>

<script>
import { setRevaSID } from "./auth.service";

export default {
    data() {
        return {
            widget: undefined,
        };
    },
    async mounted() {
        if (this.$route.query.revaSID !== undefined) {
            setRevaSID({ revaSID: this.$route.query.revaSID });
        } else {
            setSessionSID({ sid: this.$route.query.sid });
        }
        this.$router.replace({ path: "/" });
    },
};
</script>
