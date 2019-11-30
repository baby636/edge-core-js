set -e

for x in $(find src test -name '*.js'); do
  echo Stripping $x
  tsname=$(echo $x | sed s/js$/ts/)
  cat $x |
    # Change `+x` to `readonly x`:
    sed -E 's/^ *[+](\[?[_a-zA-Z]+)/readonly \1/' |

    # Fix differently-named types:
    sed -e 's/mixed/unknown/g' |
    sed -e 's/\| void/| undefined/g' |
    sed -e 's/ Iterator</ IterableIterator</g' |
    sed -e 's/TimeoutID/ReturnType<typeof setTimeout>/g' |

    # Fix utility types:
    sed -E 's/\$Call<([^,]*),[^>]*>/ReturnType<\1>/' |
    sed -E 's/\$PropertyType<([^,]*),([^>]*)>/\1[\2]/' |
    sed -e 's/$Shape</Partial</' |

    # Specific problems:
    sed -e "s/(input: any)/(input as any)/" |
    sed -e "s/<F: Function>/<F extends Function>/" |
    sed -e "s/<O: Object, P: Object>/<O, P>/" |
    sed -e "s/Node: {/Node extends {/" |
    sed -e "s/Node extends { +/Node extends {readonly /" |
    sed -e 's/import { type ArrayLike,/import {/' |
    sed -e 's/<T: { \+/<T extends { readonly /' |
    sed -e 's/<A: any\[\]/<A extends any\[\]/' |

    # Fix `import type` syntax::
    sed -e 's/import type/import/' |
    sed -E 's/type ([_a-zA-Z]+)($|,| [^=])/\1\2/g' |

    # We aren't JS anymore:
    sed -e 's!// @flow!!' |
    sed -e "s/[.]js'$/'/" |
    sed -e "s/from 'hash'/from 'hash.js'/"> $tsname
  rm $x
done

mv src/io/react-native/react-native-webview.ts src/io/react-native/react-native-webview.tsx
mv src/react-native.ts src/react-native.tsx

yarn fix
