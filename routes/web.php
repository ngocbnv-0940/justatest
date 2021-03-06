<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/img', 'MediaController@imgFromText')->name('img');

Route::group(['prefix' => 'sitemap', 'as' => 'sitemap.'], function () {
    Route::get('/posts', 'SitemapController@posts')->name('posts');
    Route::get('/categories', 'SitemapController@categories')->name('categories');
    Route::get('/tags', 'SitemapController@tags')->name('tags');
    Route::get('/users', 'SitemapController@users')->name('users');
});

Route::get('{path}', function () {
    return view('index');
})->where('path', '(.*)');

Route::get('password/reset/{token}', function () {
    return view('index');
})->name('password.reset');
