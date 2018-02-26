#include <emscripten/emscripten.h>
 
extern "C" {
  int main(int argc, char ** argv) {
    printf("Hello\n");
  }
   
  int EMSCRIPTEN_KEEPALIVE world() {
    printf("World\n");
  }
}